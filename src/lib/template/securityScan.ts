import fs from "fs";
import ts from "typescript";
import path from "path";

export type SecurityFinding = {
  file: string;
  message: string;
  line?: number;
  column?: number;
};

const DEFAULT_FORBIDDEN = new Set([
  "child_process",
  "vm",
  "net",
  "tls",
  "dgram",
  "http",
  "https",
  "fs",
  "fs/promises",
  "process",
]);

function locOf(node: ts.Node, sf: ts.SourceFile) {
  const pos = sf.getLineAndCharacterOfPosition(node.getStart(sf, false));
  return { line: pos.line + 1, column: pos.character + 1 };
}

export function scanFileForSecurity(
  filePath: string,
  forbidden = DEFAULT_FORBIDDEN
): SecurityFinding[] {
  const out: SecurityFinding[] = [];
  let raw: string;
  try {
    raw = fs.readFileSync(filePath, "utf-8");
  } catch (e: unknown) {
    out.push({
      file: filePath,
      message: `Failed to read file: ${String((e as Error)?.message || e)}`,
    });
    return out;
  }

  let sf: ts.SourceFile;
  try {
    sf = ts.createSourceFile(path.basename(filePath), raw, ts.ScriptTarget.Latest, true);
  } catch (e: unknown) {
    out.push({
      file: filePath,
      message: `Failed to parse TypeScript/JS: ${String((e as Error)?.message || e)}`,
    });
    return out;
  }

  function report(node: ts.Node, message: string) {
    const { line, column } = locOf(node, sf);
    out.push({ file: filePath, message, line, column });
  }

  function checkImportModule(moduleName: string, node: ts.Node) {
    if (/^https?:\/\//.test(moduleName)) {
      report(node, `Remote import URL detected: ${moduleName}`);
      return;
    }
    if (
      forbidden.has(moduleName) ||
      Array.from(forbidden).some(
        (f) => moduleName === f || moduleName.startsWith(f + "/") || moduleName.endsWith("/" + f)
      )
    ) {
      report(node, `Forbidden import: ${moduleName}`);
    }
  }

  function visit(n: ts.Node) {
    // static imports: import ... from 'mod'
    if (ts.isImportDeclaration(n)) {
      const mod = (n.moduleSpecifier && (n.moduleSpecifier as ts.StringLiteral).text) || "";
      checkImportModule(mod, n.moduleSpecifier || n);
    }

    // dynamic import: import(expr)
    if (ts.isCallExpression(n) && n.expression.kind === ts.SyntaxKind.ImportKeyword) {
      const arg = n.arguments[0];
      if (!arg || !ts.isStringLiteral(arg)) {
        report(n, `Dynamic import with non-literal argument`);
      } else {
        checkImportModule(arg.text, arg);
      }
    }

    // require(...) calls
    if (
      ts.isCallExpression(n) &&
      ts.isIdentifier(n.expression) &&
      n.expression.text === "require"
    ) {
      const arg = n.arguments[0];
      if (!arg || !ts.isStringLiteral(arg)) {
        report(n, `require() with non-literal argument`);
      } else {
        checkImportModule(arg.text, arg);
      }
    }

    // dangerous constructs
    if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === "eval") {
      report(n, `eval() usage detected`);
    }
    if (
      ts.isNewExpression(n) &&
      n.expression &&
      ts.isIdentifier(n.expression) &&
      n.expression.text === "Function"
    ) {
      report(n, `new Function() usage detected`);
    }

    // JSX dangerous prop
    if (ts.isJsxAttribute(n) && n.name) {
      const nameNode = n.name as ts.Node;
      const nameText = ts.isIdentifier(nameNode)
        ? (nameNode as ts.Identifier).text
        : nameNode.getText(sf);
      if (nameText === "dangerouslySetInnerHTML") {
        report(n, `dangerouslySetInnerHTML detected`);
      }
    }

    ts.forEachChild(n, visit);
  }

  visit(sf);
  return out;
}

export function scanFiles(files: string[], forbidden?: Set<string>) {
  const results: SecurityFinding[] = [];
  for (const f of files) {
    results.push(...scanFileForSecurity(f, forbidden));
  }
  return results;
}

import { MediaManager } from "@/components/memorial/MediaManager";
import { MediaGallery } from "@/components/memorial/MediaGallery";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/seperator";

interface MemorialEditorExampleProps {
  memorialId: string;
  isOwner: boolean;
}

export function MemorialEditorExample({ memorialId, isOwner }: MemorialEditorExampleProps) {
  return (
    <div className="container mx-auto space-y-8 py-8">
      {/* Basic Information Section */}
      <section>
        <h2 className="mb-4 text-2xl font-bold">Basic Information</h2>
        <Card>
          <CardContent className="pt-6">
            {/* Your existing memorial form fields here */}
            <p className="text-muted-foreground">
              Memorial form fields (name, dates, biography, etc.)
            </p>
          </CardContent>
        </Card>
      </section>

      <Separator />

      {/* Media Gallery Section - EDITABLE (Owner) */}
      {isOwner && (
        <section>
          <h2 className="mb-4 text-2xl font-bold">Media Gallery</h2>
          <MediaManager
            memorialId={memorialId}
            editable={true}
            showUploader={true}
            showAlbums={true}
            defaultTab="photos"
          />
        </section>
      )}

      {/* Media Gallery Section - VIEW ONLY (Visitors) */}
      {!isOwner && (
        <section>
          <h2 className="mb-4 text-2xl font-bold">Photos & Videos</h2>
          <Card>
            <CardContent className="pt-6">
              <MediaGallery
                memorialId={memorialId}
                type="ALL"
                editable={false}
                showAlbums={true}
                columns={3}
              />
            </CardContent>
          </Card>
        </section>
      )}

      <Separator />

      {/* Timeline Section */}
      <section>
        <h2 className="mb-4 text-2xl font-bold">Life Timeline</h2>
        <Card>
          <CardContent className="pt-6">
            {/* Your timeline component here */}
            <p className="text-muted-foreground">Timeline events go here</p>
          </CardContent>
        </Card>
      </section>

      {/* You can also use individual components */}

      {/* Example: Inline Photo Gallery in Biography Section */}
      <section>
        <h2 className="mb-4 text-2xl font-bold">Gallery Variants</h2>

        {/* Photos Only - Grid */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Photos Only (3 columns)</CardTitle>
            <CardDescription>Display only images in a grid</CardDescription>
          </CardHeader>
          <CardContent>
            <MediaGallery
              memorialId={memorialId}
              type="IMAGE"
              editable={isOwner}
              showAlbums={false}
              columns={3}
            />
          </CardContent>
        </Card>

        {/* Videos Only */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Videos Only</CardTitle>
            <CardDescription>Display only videos</CardDescription>
          </CardHeader>
          <CardContent>
            <MediaGallery
              memorialId={memorialId}
              type="VIDEO"
              editable={isOwner}
              showAlbums={false}
              columns={2}
            />
          </CardContent>
        </Card>

        {/* 4 Column Grid */}
        <Card>
          <CardHeader>
            <CardTitle>All Media (4 columns)</CardTitle>
            <CardDescription>Compact grid view</CardDescription>
          </CardHeader>
          <CardContent>
            <MediaGallery
              memorialId={memorialId}
              type="ALL"
              editable={isOwner}
              showAlbums={true}
              columns={4}
            />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

/**
 * Usage in your actual page:
 *
 * // app/memorial-pages/[memorialId]/edit/page.tsx
 * import { MemorialEditorExample } from "@/components/memorial/examples/MemorialEditorExample";
 *
 * export default async function EditMemorialPage({ params }: { params: { memorialId: string } }) {
 *   const memorial = await getMemorial(params.memorialId);
 *   const session = await getServerSession();
 *   const isOwner = session?.user?.id === memorial.ownerId;
 *
 *   return <MemorialEditorExample memorialId={params.memorialId} isOwner={isOwner} />;
 * }
 */

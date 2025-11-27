# Minimal worker image for template static checks
# Based on node:20-alpine
FROM node:20-alpine

# Install bash and other small utilities
RUN apk add --no-cache bash git

# Create working dir
WORKDIR /work

# Install global CLI tools used by checks
RUN npm install -g typescript eslint

# Default command will run static checks in mounted /work and fail on errors
CMD ["/bin/sh", "-c", "npx tsc --noEmit && npx eslint ."]

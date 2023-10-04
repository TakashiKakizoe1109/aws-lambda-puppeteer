# Use the amazon/aws-lambda-nodejs Docker image as base
FROM amazon/aws-lambda-nodejs:18

# Install system dependencies for Puppeteer
# Note: This list of dependencies may need to be adjusted based on your specific use-case
RUN yum install -y \
    pango.x86_64 \
    libXcomposite.x86_64 \
    libXcursor.x86_64 \
    libXdamage.x86_64 \
    libXext.x86_64 \
    libXi.x86_64 \
    libXtst.x86_64 \
    cups-libs.x86_64 \
    libXScrnSaver.x86_64 \
    libXrandr.x86_64 \
    GConf2.x86_64 \
    alsa-lib.x86_64 \
    atk.x86_64 \
    gtk3.x86_64 \
    ipa-gothic-fonts \
    xorg-x11-fonts-100dpi \
    xorg-x11-fonts-75dpi \
    xorg-x11-utils \
    xorg-x11-fonts-cyrillic \
    xorg-x11-fonts-Type1 \
    xorg-x11-fonts-misc \
    webkitgtk4 \
    webkitgtk4-devel \
    && yum clean all

# Copy package.json and package-lock.json
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy local code to the container image
COPY src/ .

# Set the CMD to your handler (could also be done as a parameter override outside of the Dockerfile)
CMD [ "app.handler" ]

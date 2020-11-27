FROM node:14

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

# If you are building your code for production
# RUN npm ci --only=production
# Let's see if we are!
ARG NODE_ENV
ENV NODE_ENV ${NODE_ENV}
RUN if [ "$NODE_ENV" = "production" ]; then npm ci --only=production; else npm install; fi
					
# Geoip-lite is used to sniff client's geographical location so we can respect
# their local privacy regulation.
# It is your responsibility to do the necessary modifications (pseudonymisation
# of user data etc). If you have limited geographical scope and have no privacy
# regulation issues, leave GEOIPLICENSETOKEN empty and we'll skip the geoip
# stuff here and in the proxy server code.

WORKDIR /usr/src/app/node_modules/geoip-lite

ARG GEOIPLICENSETOKEN
ENV GEOIPLICENSETOKEN ${GEOIPLICENSETOKEN}

RUN if [ "$GEOIPLICENSETOKEN" != "" ]; then npm run-script updatedb license_key=${GEOIPLICENSETOKEN}; fi

WORKDIR /usr/src/app

# Bundle app source
COPY . .

EXPOSE 8012

CMD [ "node", "src/hokema_speech_socket_proxy.js" ]
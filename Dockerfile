FROM node:10
RUN mkdir -p /home/node/compositor/node_modules && chown -R node:node /home/node/compositor
WORKDIR /home/node/compositor
COPY package*.json ./
RUN npm install
COPY . .
COPY --chown=node:node . .
USER node
# EXPOSE 4000
CMD [ "npm", "start" ]
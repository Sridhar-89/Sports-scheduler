<<<<<<< HEAD
FROM node:lts-alpine as base
WORKDIR /
COPY package.json /
COPY . /   
=======
# FROM node:lts-alpine as base
# WORKDIR /
# COPY package.json /
# COPY . /   
# EXPOSE 5000

# FROM base as production
# ENV NODE_ENV=production
# RUN npm install
# COPY . /
# CMD node index.js

# FROM base as dev
# ENV NODE_ENV=development
# RUN npm install -g nodemon && npm install
# COPY . /
# CMD npm run start



FROM  --platform=$BUILDPLATFORM node:lts-alpine as base
WORKDIR /capstone
COPY package.json /
>>>>>>> f34b7c602f93000cd46b4ac8c582f2ed77816145
EXPOSE 5000

FROM base as production
ENV NODE_ENV=production
RUN npm install
<<<<<<< HEAD
COPY . /
CMD node index.js
=======
COPY . .
CMD ["node", "index.js"]
>>>>>>> f34b7c602f93000cd46b4ac8c582f2ed77816145

FROM base as dev
ENV NODE_ENV=development
RUN npm install -g nodemon && npm install
<<<<<<< HEAD
COPY . /
CMD npm run start
=======
COPY . .
CMD ["npm", "run", "start"]
>>>>>>> f34b7c602f93000cd46b4ac8c582f2ed77816145

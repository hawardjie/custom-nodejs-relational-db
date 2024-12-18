FROM node:23-alpine

WORKDIR /home/hawardjie/gitprojects/custom-nodejs-relational-db
COPY ./package.json ./
RUN npm install
COPY ./ ./

CMD ["npm", "start"]
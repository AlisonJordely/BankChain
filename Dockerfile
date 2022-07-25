FROM node:12
ENV NODE_ENV testing
ENV PORT 8000
ENV HOSTNAME 0.0.0.0

RUN mkdir -p /storage
RUN mkdir -p /app
WORKDIR /app
COPY package.json .

# Install MEAN.JS Prerequisites
RUN npm install --quiet && npm audit fix && npm cache clean --force

# Install npm packages
# COPY package.json /app/package.json

#RUN npm install --quiet && mv node_modules ../
# RUN npm install --quiet && npm audit fix && npm cache clean --force

#EXPOSE 80 443 35729 8080 8443
#CMD npm run start:localtest
COPY . /app
EXPOSE 80 443 3000 35729 8000 8443
CMD ["node", "backend-BankA.js"]
# Docker lets us build, deploy, run, update, and manage containers. 
# Containers are standardized, executable components that combine application source code with 
# the operating system (OS) libraries and dependencies required to run that code in any environment

# A docker file is a blueprint for a docker image
# A docker image is a blueprint for a container
# The container will run our code within its own isolated file system



# Use an official Node runtime as a parent image
FROM node:18

# Set the working directory in the container to /app
WORKDIR /app

# Install ffmpeg in the container
RUN apt-get update && apt-get install -y ffmpeg

# Copy package.json and package-lock.json into the working directory (image)
COPY package*.json ./

# Install any needed packages specified in package.json
RUN npm install

# Copy app source inside the docker image (src file)
COPY . .

# Make port 3000 available outside this container
EXPOSE 3000

# Define the command to run your app using CMD (only one CMD allowed)
CMD [ "npm", "start" ]
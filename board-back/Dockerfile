FROM openjdk:17
WORKDIR /app
COPY build/libs/*.jar app.jar
EXPOSE 4000
# ENTRYPOINT ["java", "-jar", "app.jar", "--spring.profiles.active=local"]
ENTRYPOINT ["java", "-jar", "app.jar"]
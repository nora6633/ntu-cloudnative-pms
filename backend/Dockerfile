# Build stage
FROM eclipse-temurin:25-jdk-alpine AS builder
WORKDIR /app

# Copy the Maven wrapper first so the next layer is cache-friendly —
# dependency:go-offline only re-runs when pom.xml changes
COPY mvnw .
RUN chmod +x mvnw
COPY .mvn .mvn
COPY pom.xml .
RUN ./mvnw dependency:go-offline -q

COPY src src
RUN ./mvnw package -DskipTests -q

# Runtime stage — JRE-only image, significantly smaller than the JDK
FROM eclipse-temurin:25-jre-alpine
WORKDIR /app

# Run as a non-root user — principle of least privilege
RUN addgroup -S app && adduser -S app -G app
COPY --from=builder --chown=app:app /app/target/*.jar app.jar
USER app

# Defaults — both can be overridden at runtime with docker run -e
ENV SPRING_PROFILES_ACTIVE=prod
ENV SERVER_PORT=8080
# EXPOSE is build-time metadata only; actual port binding is set via -p at docker run
EXPOSE ${SERVER_PORT}

ENTRYPOINT ["java", "-jar", "app.jar"]

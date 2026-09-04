# Tiket Connect Agent — container deployment.
#   docker build -t tiket-agent .
#   docker run -d --restart unless-stopped \
#     -v $(pwd)/tiket-agent.conf:/etc/tiket/tiket-agent.conf:ro \
#     -v tiket-agent-data:/var/lib/tiket \
#     tiket-agent
# The container makes outbound HTTPS connections only — expose no ports.

FROM golang:1.25-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY cmd ./cmd
COPY internal ./internal
RUN CGO_ENABLED=0 go build -ldflags "-s -w" -o /tiket-agent ./cmd/tiket-agent

FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=build /tiket-agent /usr/local/bin/tiket-agent
WORKDIR /var/lib/tiket
ENV TIKET_CREDENTIALS_FILE=/var/lib/tiket/credentials.json
ENTRYPOINT ["tiket-agent"]
CMD ["run", "--config", "/etc/tiket/tiket-agent.conf"]

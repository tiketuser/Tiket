.PHONY: build test selftest release clean

BINARY := tiket-agent
LDFLAGS := -s -w

build:
	CGO_ENABLED=0 go build -ldflags "$(LDFLAGS)" -o bin/$(BINARY) ./cmd/tiket-agent

test:
	go vet ./...
	go test ./...

selftest: build
	./bin/$(BINARY) selftest --vectors ../spec/test-vectors.json

# Cross-compile the release matrix. Checksums accompany every artifact so a
# partner can verify what they downloaded (see ../SECURITY.md).
release:
	mkdir -p dist
	CGO_ENABLED=0 GOOS=linux   GOARCH=amd64 go build -ldflags "$(LDFLAGS)" -o dist/$(BINARY)-linux-amd64 ./cmd/tiket-agent
	CGO_ENABLED=0 GOOS=linux   GOARCH=arm64 go build -ldflags "$(LDFLAGS)" -o dist/$(BINARY)-linux-arm64 ./cmd/tiket-agent
	CGO_ENABLED=0 GOOS=windows GOARCH=amd64 go build -ldflags "$(LDFLAGS)" -o dist/$(BINARY)-windows-amd64.exe ./cmd/tiket-agent
	CGO_ENABLED=0 GOOS=darwin  GOARCH=arm64 go build -ldflags "$(LDFLAGS)" -o dist/$(BINARY)-darwin-arm64 ./cmd/tiket-agent
	cp ../spec/test-vectors.json dist/
	cd dist && shasum -a 256 $(BINARY)-* test-vectors.json > SHA256SUMS

clean:
	rm -rf bin dist

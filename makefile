# Makefile for Chrome Extension Packaging

# Variables
EXTENSION_NAME = viewport-resizer
DIST_DIR = dist
SOURCE_DIR = .
MANIFEST = manifest.json

# Extract version from manifest.json
VERSION := $(shell grep -o '"version": "[^"]*"' $(MANIFEST) | cut -d'"' -f4)
ZIP_NAME = $(DIST_DIR)/$(EXTENSION_NAME)_v$(VERSION).zip

# Exclusions
EXCLUSIONS = ".*" "src/assets/demo.mov"

# Default target
all: package

# Create the distribution directory
$(DIST_DIR):
	mkdir -p $(DIST_DIR)

# Clean the build artifacts
clean:
	rm -rf $(DIST_DIR)

# Package the Chrome extension with maximum compression and specific exclusions
package: clean $(DIST_DIR)
	@echo "Packaging version $(VERSION) with maximum compression"
	zip -9 -r $(ZIP_NAME) $(SOURCE_DIR) -x $(EXCLUSIONS) \
		$$(git ls-files --others --ignored --exclude-standard -z | xargs -0 -I{} echo '{}') \
		-i "*" "*/*"
	@echo "Chrome extension has been packaged as $(ZIP_NAME) with maximum compression"

# Phony targets
.PHONY: all clean package

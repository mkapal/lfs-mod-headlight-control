rm -rf dist/bin && \
pkg -o "dist/bin/LFS AI control.exe" . && \
cp config.toml dist/bin/
cp scripts/README.txt dist/bin/
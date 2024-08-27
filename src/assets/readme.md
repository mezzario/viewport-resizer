### Generate Icons

```bash
for x in 16 32 48 128 ; do inkscape --export-type=png --export-filename=src/assets/icon_${x}.png -w ${x} src/assets/icon.svg ; done
```

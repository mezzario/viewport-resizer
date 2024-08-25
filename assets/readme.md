### Generate Icons

```bash
# active color: #21d521
for x in 16 32 48 128 ; do inkscape --export-type=png --export-filename=icon_active_${x}.png -w ${x} icon.svg ; done

# inactive color: #b1cbd0
for x in 16 32 48 128 ; do inkscape --export-type=png --export-filename=icon_inactive_${x}.png -w ${x} icon.svg ; done
```

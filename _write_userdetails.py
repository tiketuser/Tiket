
import pathlib

content = open("c:/Users/Aviv Nir/Tiket/_userdetails_content.tsx", encoding="utf-8").read()
p = pathlib.Path("c:/Users/Aviv Nir/Tiket/app/components/UserDetails/UserDetails.tsx")
p.write_text(content, encoding="utf-8")
print("Done:", p.stat().st_size)

from pathlib import Path
root = Path(r"c:\Users\IT HARDWARE HUB\Desktop\HTML\applianceshub")
for path in root.rglob('*'):
    if path.is_file() and path.suffix.lower() in {'.html', '.css', '.js', '.json', '.md', '.txt'}:
        try:
            text = path.read_text(encoding='utf-8')
        except Exception:
            continue
        new_text = text.replace('images/', 'image/').replace('./images/', './image/')
        if new_text != text:
            path.write_text(new_text, encoding='utf-8')
            print(path.relative_to(root))

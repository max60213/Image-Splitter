from flask import Flask, request, send_file, jsonify
from flask_cors import CORS  # 新增 CORS 支援
from PIL import Image
import os
import io
import zipfile

app = Flask(__name__)
CORS(app)  # 允許跨來源請求

@app.route('/api/split', methods=['POST'])
def split_image():
    # 取得上傳檔案與參數
    file = request.files.get('image')
    rows = int(request.form.get('rows', 1))
    cols = int(request.form.get('cols', 1))
    if not file or rows < 1 or cols < 1:
        return jsonify({'error': 'Invalid input'}), 400

    img = Image.open(file.stream)
    img_width, img_height = img.size
    tile_width = img_width // cols
    tile_height = img_height // rows

    # 將分割後的小圖存入記憶體中的 zip
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w') as zipf:
        for row in range(rows):
            for col in range(cols):
                left = col * tile_width
                upper = row * tile_height
                right = left + tile_width
                lower = upper + tile_height
                box = (left, upper, right, lower)
                tile = img.crop(box)
                img_bytes = io.BytesIO()
                tile.save(img_bytes, format='PNG')
                img_bytes.seek(0)
                zipf.writestr(f'tile_{row}_{col}.png', img_bytes.read())
    zip_buffer.seek(0)
    return send_file(zip_buffer, mimetype='application/zip', as_attachment=True, download_name='tiles.zip')

if __name__ == '__main__':
    app.run(port=5001, debug=True) 
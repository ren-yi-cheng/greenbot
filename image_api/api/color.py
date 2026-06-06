from flask import Flask, request, jsonify
from PIL import Image
import json

app = Flask(__name__)

def rgb_to_hex(rgb):
    return '#{:02x}{:02x}{:02x}'.format(rgb[0], rgb[1], rgb[2]).upper()

@app.route('/api/color', methods=['POST'])
def process_image():
    # 1. 检查是不是发来了真实的图片文件！
    if 'file' not in request.files:
        return jsonify({"json_data": "[]", "color_types": 0, "status": "未收到图片文件"}), 400
    
    file = request.files['file']

    try:
        # 2. 直接从文件流读取，无需再做繁琐的 base64 解码！
        img = Image.open(file.stream).convert('RGB')
        img.thumbnail((600, 600))
        
        color_counts = {}
        ignored_pixels = 0
        step = 16 
        
        for r, g, b in img.getdata():
            # 排除纯白底色和黑灰线条
            if (r > 240 and g > 240 and b > 240) or (r < 40 and g < 40 and b < 40):
                ignored_pixels += 1
                continue
            
            r_quant = min(255, max(0, (r // step) * step + (step // 2)))
            g_quant = min(255, max(0, (g // step) * step + (step // 2)))
            b_quant = min(255, max(0, (b // step) * step + (step // 2)))
            
            hex_code = rgb_to_hex((r_quant, g_quant, b_quant))
            color_counts[hex_code] = color_counts.get(hex_code, 0) + 1

        total_valid_pixels = sum(color_counts.values())

        if total_valid_pixels == 0:
            return jsonify({"json_data": "[]", "color_types": 0, "status": "未检测到有效色块"})

        threshold = total_valid_pixels * 0.005
        filtered_colors = {k: v for k, v in color_counts.items() if v >= threshold}
        sorted_colors = sorted(filtered_colors.items(), key=lambda x: x[1], reverse=True)

        result_list = []
        for hex_code, count in sorted_colors:
            percentage = (count / total_valid_pixels) * 100
            result_list.append({
                "hex": hex_code,
                "count": count,
                "percentage": round(percentage, 1)
            })

        return jsonify({
            "json_data": json.dumps(result_list, ensure_ascii=False),
            "color_types": len(result_list),
            "status": "解析成功"
        })

    except Exception as e:
        return jsonify({"json_data": "[]", "color_types": 0, "status": f"处理失败: {str(e)}"}), 500
import os

handler_path = os.path.join(os.path.dirname(__file__), 'table_handler.js')
style_path = os.path.join(os.path.dirname(__file__), 'table_style.css')
style2_path = os.path.join(os.path.dirname(__file__), '..', 'table_style.css')

# Update handler
with open(handler_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('data.innerHTML = "\\U0001f451";', "data.innerHTML = '<span class=\"crown-icon\">\\U0001f451</span>';")
content = content.replace('data.innerHTML = "\\U0001f948";', "data.innerHTML = '<span class=\"medal-icon\">\\U0001f948</span>';")

with open(handler_path, 'w', encoding='utf-8') as f:
    f.write(content)

# Update style list (both just in case)
addition = """
.crown-icon {
	display: inline-block;
	font-size: 45px;
	filter: drop-shadow(0px 6px 8px rgba(0, 0, 0, 0.4));
	animation: crownFloat 2s ease-in-out infinite;
}

.medal-icon {
	display: inline-block;
	font-size: 35px;
	filter: drop-shadow(0px 4px 5px rgba(0, 0, 0, 0.3));
	animation: medalFloat 2s ease-in-out infinite;
}

@keyframes crownFloat {
	0%, 100% {
		transform: translateY(0) scale(1) rotate(-5deg);
	}
	50% {
		transform: translateY(-8px) scale(1.15) rotate(5deg);
	}
}

@keyframes medalFloat {
	0%, 100% {
		transform: translateY(0) scale(1);
	}
	50% {
		transform: translateY(-4px) scale(1.1);
	}
}
"""

for path in [style_path, style2_path]:
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        if '.crown-icon' not in content:
            with open(path, 'a', encoding='utf-8') as f:
                f.write(addition)

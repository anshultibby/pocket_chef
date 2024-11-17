from fastapi import UploadFile
import base64
from anthropic import Anthropic

client = Anthropic()

async def extract_text(file: UploadFile) -> str:
    # Read image file and convert to base64
    contents = await file.read()
    base64_image = base64.b64encode(contents).decode('utf-8')
    
    # Call Claude Vision API
    message = client.messages.create(
        max_tokens=1000,
        model="claude-3-5-sonnet-latest",
        messages=[{
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "Please extract all the text from this image. Return only the extracted text, without any additional commentary."
                },
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": "image/jpeg",
                        "data": base64_image
                    }
                }
            ]
        }]
    )
    
    return message.content[0].text

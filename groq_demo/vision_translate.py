##groq needs to be pip installed
from groq import Groq
import base64


# Function to encode the image
def encode_image(image_path):
  with open(image_path, "rb") as image_file:
    return base64.b64encode(image_file.read()).decode('utf-8')

# Path to your image
image_path = "/content/test4.png"

# Getting the base64 string
base64_image = encode_image(image_path) #path here

client = Groq(api_key= "u know the drill")

chat_completion = client.chat.completions.create(
    messages=[
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "translate all the text in this image to english"}, #to have it transcribe, simply prompt "transcribe all the text in this image"
                {
                    "type": "image_url",
                    "image_url": { ##can indeed paste an image url here without downloading
                        "url": f"data:image/jpeg;base64,{base64_image}",
                    },
                },
            ],
        }
    ],
    model="llama-3.2-11b-vision-preview",
)

print(chat_completion.choices[0].message.content)
###Requires groq to be installed (pip install groq)
import os
from groq import Groq



client = Groq(
    api_key= "" ###env var api key or put here for testing,
)

filename = #filepath here #find library record audio and put it here, use wake word or button to do so

with open (filename,"rb") as file:

    transcription = client.audio.translations.create(
        file=(filename,file.read()),
        model="whisper-large-v3", #model required for translation
      prompt="",
        response_format="json", #change?
        temperature=0.0
    )

    print(transcription.text)
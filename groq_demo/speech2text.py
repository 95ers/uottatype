import os
from groq import Groq

client = Groq()

filename = os.path.dirname(__file__)+"/filhere.mp3"#find library record audio and put it here, use wake word or button to do so

with open (filename,"rb") as file:

    transcription = client.audio.transcriptions.create(
        file=(filename,file.read()),
        model="whisper-large-v3-turbo",
        prompt="",
        respone_format="json", #change?
        language="en",
        temperature=0.0
    )

    print(transcription.text)

    #TODO: downsample either client side or serverside
    #for client side use ffpmeg
    """
    ffmpeg \
  -i <your file> \
  -ar 16000 \
  -ac 1 \
  -map 0:a \
  -c:a flac \
  <output file name>.flac
  """
import sys
import os
import speech_recognition as sr


def speechRecognition(file):
    r = sr.Recognizer()
    with sr.AudioFile(file) as source:
        audio = r.record(source)  # read the entire audio file

    os.remove(file)
    parsed_text = ""

    try:
        parsed_text = r.recognize_sphinx(audio)
        #print("Sphinx thinks you said `{0}`".format(parsedText))
    except sr.UnknownValueError:
        parsed_text = "Unknown Value"
    except sr.RequestError as e:
        parsed_text = "Request error"
    finally:
        print(parsed_text)
        sys.stdout.flush()


speechRecognition(sys.argv[1])

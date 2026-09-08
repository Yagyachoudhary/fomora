insert into launches
  (url, name, source, category, description, pricing, license, runs_locally, languages, free_alternative_to, hardware_note, velocity, signal_badge, base_momentum)
values
('https://github.com/openai/whisper', 'Whisper', 'OpenAI', 'Voice AI',
 'Transcription and translation across ~99 languages. The default open baseline.',
 'open-source', 'MIT', true, ARRAY['Multilingual'], 'Otter.ai, Rev, AssemblyAI', 'Runs on CPU; GPU much faster', 'Steady', 'Paradigm Shift', 95),

('https://github.com/SYSTRAN/faster-whisper', 'faster-whisper', 'SYSTRAN', 'Voice AI',
 'Reimplementation of Whisper that is several times faster with lower memory use.',
 'open-source', 'MIT', true, ARRAY['Multilingual'], 'Rev, Otter.ai', 'Runs well on modest GPUs', 'Steady', 'High Signal', 82),

('https://huggingface.co/nvidia/canary-qwen-2.5b', 'Canary-Qwen 2.5B', 'NVIDIA', 'Voice AI',
 'Strong English accuracy with clean punctuation and formatting.',
 'open-source', 'Open weights', true, ARRAY['English'], 'AssemblyAI, Deepgram', 'GPU recommended', 'Heating up', 'High Signal', 80),

('https://huggingface.co/models?search=qwen%20asr', 'Qwen3-ASR', 'Alibaba', 'Voice AI',
 'Speech recognition across 52 languages with language ID and timestamps.',
 'open-source', 'Open weights', true, ARRAY['Multilingual','Chinese','English'], 'Google Speech-to-Text', 'GPU recommended', 'Heating up', 'High Signal', 79),

('https://github.com/usefulsensors/moonshine', 'Moonshine', 'Useful Sensors', 'Voice AI',
 'Fast on-device speech recognition built for real-time and edge use.',
 'open-source', 'MIT', true, ARRAY['English'], 'Deepgram real-time', 'Runs on CPU and edge devices', 'Steady', 'Emerging', 70),

('https://huggingface.co/hexgrad/Kokoro-82M', 'Kokoro-82M', 'Hexgrad', 'Voice AI',
 'Only 82M parameters but quality comparable to far larger models.',
 'open-source', 'Apache-2.0', true, ARRAY['English','French','Japanese','Korean','Mandarin'], 'ElevenLabs, PlayHT', 'Runs on CPU', 'Heating up', 'Paradigm Shift', 88),

('https://github.com/resemble-ai/chatterbox', 'Chatterbox', 'Resemble AI', 'Voice AI',
 'Clones a voice from about five seconds of audio, with emotion control.',
 'open-source', 'MIT', true, ARRAY['Multilingual'], 'ElevenLabs voice cloning', 'GPU recommended', 'Heating up', 'High Signal', 84),

('https://huggingface.co/neuphonic/neutts-air', 'NeuTTS Air', 'Neuphonic', 'Voice AI',
 'Voice synthesis small enough to run on phones and Raspberry Pi.',
 'open-source', 'Open weights', true, ARRAY['English'], 'ElevenLabs, Murf', 'Runs on CPU and Raspberry Pi', 'Steady', 'Emerging', 72),

('https://huggingface.co/canopylabs/orpheus-3b-0.1-ft', 'Orpheus TTS', 'Canopy Labs', 'Voice AI',
 'Llama-based expressive speech, available from 150M to 3B parameters.',
 'open-source', 'Apache-2.0', true, ARRAY['English'], 'ElevenLabs', 'GPU for larger sizes', 'Steady', 'Emerging', 71),

('https://github.com/rhasspy/piper', 'Piper', 'Rhasspy', 'Voice AI',
 'Very fast CPU-only speech synthesis designed for local assistants.',
 'open-source', 'MIT', true, ARRAY['Multilingual'], 'Amazon Polly, Google TTS', 'CPU only, very light', 'Steady', 'High Signal', 74)
on conflict (url) do update set
  pricing = excluded.pricing,
  license = excluded.license,
  runs_locally = excluded.runs_locally,
  languages = excluded.languages,
  free_alternative_to = excluded.free_alternative_to,
  hardware_note = excluded.hardware_note;

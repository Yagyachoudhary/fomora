-- Fomora — "Pay for this, not that"
-- Curated seed of genuinely good free / open-source alternatives to paid AI tools.
-- Run AFTER 002_open_and_free.sql
--
-- This list is a starting point. The Hugging Face crawler keeps it fresh —
-- but curation matters here, because HF surfaces 90,000+ models and almost
-- nobody can tell which six actually matter.

insert into launches
  (url, name, source, category, description, pricing, license, runs_locally, languages, free_alternative_to, hardware_note, velocity, signal_badge, base_momentum)
values

-- ────────────── SPEECH TO TEXT ──────────────
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

-- ────────────── TEXT TO SPEECH ──────────────
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
 'open-source', 'MIT', true, ARRAY['Multilingual'], 'Amazon Polly, Google TTS', 'CPU only, very light', 'Steady', 'High Signal', 74),

-- ────────────── IMAGE GENERATION ──────────────
('https://huggingface.co/black-forest-labs/FLUX.1-schnell', 'FLUX.1 [schnell]', 'Black Forest Labs', 'Image AI',
 'High-quality image generation under Apache 2.0 — commercial use permitted.',
 'open-source', 'Apache-2.0', true, ARRAY['English'], 'Midjourney, DALL-E', 'Around 12GB VRAM, quantised versions run lighter', 'Exploding', 'Paradigm Shift', 93),

('https://huggingface.co/black-forest-labs/FLUX.1-dev', 'FLUX.1 [dev]', 'Black Forest Labs', 'Image AI',
 'Higher quality than schnell but licensed for non-commercial use only.',
 'open-source', 'Non-commercial', true, ARRAY['English'], 'Midjourney', 'Around 24GB VRAM', 'Exploding', 'High Signal', 89),

('https://huggingface.co/stabilityai/stable-diffusion-3.5-large', 'Stable Diffusion 3.5', 'Stability AI', 'Image AI',
 'Anchors the largest open image ecosystem — LoRAs, ControlNets, tooling.',
 'open-source', 'Community licence', true, ARRAY['English'], 'Midjourney, Adobe Firefly', 'Varies by variant', 'Steady', 'High Signal', 85),

('https://huggingface.co/Kwai-Kolors/Kolors', 'Kolors', 'Kuaishou', 'Image AI',
 'Handles non-English prompts well, where most image models are English-centric.',
 'open-source', 'Open weights', true, ARRAY['Chinese','English'], 'Midjourney', 'GPU required', 'Steady', 'Emerging', 70),

('https://github.com/comfyanonymous/ComfyUI', 'ComfyUI', 'Community', 'Design Tools',
 'Node-based interface for running open image and video models locally.',
 'open-source', 'GPL-3.0', true, ARRAY['English'], 'Midjourney web app', 'Depends on the model you load', 'Exploding', 'High Signal', 87),

('https://github.com/lllyasviel/Fooocus', 'Fooocus', 'Community', 'Design Tools',
 'The simplest way to run local image generation — almost no settings to learn.',
 'open-source', 'GPL-3.0', true, ARRAY['English'], 'Midjourney', 'Around 8GB VRAM', 'Steady', 'High Signal', 76),

('https://drawthings.ai', 'Draw Things', 'Draw Things', 'Design Tools',
 'Free local image generation on Mac and iPhone, no setup required.',
 'free', 'Proprietary (free)', true, ARRAY['English'], 'Midjourney mobile', 'Runs on Apple Silicon', 'Steady', 'Emerging', 68),

-- ────────────── LARGE LANGUAGE MODELS ──────────────
('https://ollama.com', 'Ollama', 'Ollama', 'AI Infra',
 'One command to run open LLMs locally. The easiest on-ramp there is.',
 'open-source', 'MIT', true, ARRAY['Multilingual'], 'ChatGPT Plus, Claude Pro', 'Works on laptops; bigger models need more RAM', 'Exploding', 'Paradigm Shift', 91),

('https://lmstudio.ai', 'LM Studio', 'LM Studio', 'AI Infra',
 'Desktop app for downloading and chatting with open models offline.',
 'free', 'Proprietary (free)', true, ARRAY['Multilingual'], 'ChatGPT Plus', 'Mac, Windows, Linux', 'Steady', 'High Signal', 80),

('https://huggingface.co/Qwen', 'Qwen (open models)', 'Alibaba', 'Open Source AI',
 'Broad open model family covering chat, coding, vision and audio.',
 'open-source', 'Apache-2.0 (most)', true, ARRAY['Multilingual','Chinese','English'], 'ChatGPT, Claude', 'Sizes from tiny to very large', 'Exploding', 'Paradigm Shift', 92),

('https://huggingface.co/deepseek-ai', 'DeepSeek (open models)', 'DeepSeek', 'Open Source AI',
 'Strong open reasoning and coding models released with open weights.',
 'open-source', 'MIT (most)', true, ARRAY['Multilingual','Chinese','English'], 'ChatGPT Plus, Claude Pro', 'Large models need serious hardware', 'Exploding', 'Paradigm Shift', 90),

('https://huggingface.co/meta-llama', 'Llama (open models)', 'Meta', 'Open Source AI',
 'The family that made local LLMs mainstream; enormous tooling ecosystem.',
 'open-source', 'Llama licence', true, ARRAY['Multilingual'], 'ChatGPT Plus', 'Wide range of sizes', 'Steady', 'High Signal', 86),

('https://huggingface.co/google/gemma-3-27b-it', 'Gemma', 'Google', 'Open Source AI',
 'Compact open models tuned to run well on consumer hardware.',
 'open-source', 'Gemma licence', true, ARRAY['Multilingual'], 'ChatGPT Plus', 'Small sizes run on laptops', 'Steady', 'High Signal', 79),

('https://huggingface.co/mistralai', 'Mistral (open models)', 'Mistral AI', 'Open Source AI',
 'Efficient European open-weight models with permissive licensing.',
 'open-source', 'Apache-2.0 (most)', true, ARRAY['Multilingual','French','English'], 'ChatGPT Plus', 'Efficient at small sizes', 'Steady', 'High Signal', 81),

-- ────────────── TRANSLATION & INDIAN LANGUAGES ──────────────
('https://huggingface.co/facebook/nllb-200-distilled-600M', 'NLLB-200', 'Meta', 'Writing AI',
 'Translation across 200 languages, including many with little coverage elsewhere.',
 'open-source', 'CC-BY-NC', true, ARRAY['200+ languages'], 'Google Translate API, DeepL', 'Distilled versions run on CPU', 'Steady', 'High Signal', 77),

('https://github.com/AI4Bharat/IndicTrans2', 'IndicTrans2', 'AI4Bharat', 'Writing AI',
 'Translation across 22 scheduled Indian languages, built specifically for Indic scripts.',
 'open-source', 'MIT', true, ARRAY['Hindi','Tamil','Telugu','Bengali','Marathi','Gujarati','Kannada','Malayalam','Punjabi','Odia','Assamese','Urdu'], 'Google Translate API', 'GPU recommended', 'Steady', 'High Signal', 75),

('https://ai4bharat.iitm.ac.in', 'AI4Bharat', 'IIT Madras', 'Open Source AI',
 'Open Indic-language models for speech, translation and text — free to use.',
 'open-source', 'MIT (most)', true, ARRAY['Hindi','Tamil','Telugu','Bengali','Marathi','Indic'], 'Paid Indic language APIs', 'Varies by model', 'Heating up', 'High Signal', 73),

-- ────────────── OCR & DOCUMENTS ──────────────
('https://github.com/VikParuchuri/surya', 'Surya', 'Datalab', 'Data & Analytics',
 'OCR and layout detection across 90+ languages, strong on non-Latin scripts.',
 'open-source', 'GPL-3.0', true, ARRAY['90+ languages','Hindi','Devanagari'], 'Google Document AI, AWS Textract', 'GPU recommended', 'Heating up', 'High Signal', 74),

('https://github.com/PaddlePaddle/PaddleOCR', 'PaddleOCR', 'Baidu', 'Data & Analytics',
 'Mature multilingual OCR toolkit with lightweight mobile-ready models.',
 'open-source', 'Apache-2.0', true, ARRAY['Multilingual','Chinese','English'], 'AWS Textract', 'Runs on CPU', 'Steady', 'High Signal', 72),

('https://github.com/tesseract-ocr/tesseract', 'Tesseract', 'Community', 'Data & Analytics',
 'The long-standing open OCR engine, supporting 100+ languages.',
 'open-source', 'Apache-2.0', true, ARRAY['100+ languages'], 'Adobe Acrobat OCR', 'CPU only', 'Steady', 'Emerging', 63),

-- ────────────── MUSIC & AUDIO ──────────────
('https://huggingface.co/facebook/musicgen-large', 'MusicGen', 'Meta', 'Music & Audio AI',
 'Text-to-music generation with open weights and permissive tooling.',
 'open-source', 'CC-BY-NC', true, ARRAY['English'], 'Suno, Udio', 'GPU recommended', 'Steady', 'Emerging', 68),

('https://huggingface.co/stabilityai/stable-audio-open-1.0', 'Stable Audio Open', 'Stability AI', 'Music & Audio AI',
 'Generates sound effects and short audio samples locally.',
 'open-source', 'Community licence', true, ARRAY['English'], 'Soundraw, Epidemic Sound', 'GPU recommended', 'Steady', 'Emerging', 65),

-- ────────────── VIDEO ──────────────
('https://huggingface.co/Lightricks/LTX-Video', 'LTX-Video', 'Lightricks', 'Video AI',
 'Fast open video generation that runs on consumer GPUs.',
 'open-source', 'Open weights', true, ARRAY['English'], 'Runway, Sora', 'Around 12GB VRAM', 'Heating up', 'High Signal', 78),

('https://huggingface.co/genmo/mochi-1-preview', 'Mochi 1', 'Genmo', 'Video AI',
 'Open video generation model with permissive licensing.',
 'open-source', 'Apache-2.0', true, ARRAY['English'], 'Runway Gen-4', 'High VRAM needed', 'Steady', 'Emerging', 70),

-- ────────────── CODING ──────────────
('https://github.com/continuedev/continue', 'Continue.dev', 'Continue', 'AI Coding',
 'Open-source coding assistant for VS Code and JetBrains; bring your own model.',
 'open-source', 'Apache-2.0', true, ARRAY['English'], 'GitHub Copilot ($10/mo)', 'Runs against local or hosted models', 'Heating up', 'High Signal', 80),

('https://github.com/cline/cline', 'Cline', 'Cline', 'AI Coding',
 'Open agentic coding extension that can use local or hosted models.',
 'open-source', 'Apache-2.0', true, ARRAY['English'], 'Cursor ($20/mo)', 'Depends on chosen model', 'Exploding', 'High Signal', 83),

('https://huggingface.co/Qwen/Qwen2.5-Coder-32B-Instruct', 'Qwen Coder', 'Alibaba', 'AI Coding',
 'Open coding model competitive with paid assistants on many tasks.',
 'open-source', 'Apache-2.0', true, ARRAY['English'], 'GitHub Copilot', 'Smaller sizes run locally', 'Steady', 'High Signal', 79)

on conflict (url) do update set
  pricing = excluded.pricing,
  license = excluded.license,
  runs_locally = excluded.runs_locally,
  languages = excluded.languages,
  free_alternative_to = excluded.free_alternative_to,
  hardware_note = excluded.hardware_note;

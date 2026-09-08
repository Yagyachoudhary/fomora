-- Fomora — put a number on it.
-- "Whisper replaces Otter.ai" is informative.
-- "$87/month you don't need to spend" is shareable.

alter table launches add column if not exists replaces_cost_monthly int;

-- Approximate entry-level monthly USD price of the paid product being replaced.
-- Deliberately conservative — understating is safer than overstating.
update launches set replaces_cost_monthly = 20 where name = 'Whisper';
update launches set replaces_cost_monthly = 20 where name = 'faster-whisper';
update launches set replaces_cost_monthly = 20 where name = 'Canary-Qwen 2.5B';
update launches set replaces_cost_monthly = 18 where name = 'Qwen3-ASR';
update launches set replaces_cost_monthly = 20 where name = 'Moonshine';

update launches set replaces_cost_monthly = 22 where name = 'Kokoro-82M';
update launches set replaces_cost_monthly = 22 where name = 'Chatterbox';
update launches set replaces_cost_monthly = 22 where name = 'NeuTTS Air';
update launches set replaces_cost_monthly = 22 where name = 'Orpheus TTS';
update launches set replaces_cost_monthly = 10 where name = 'Piper';

update launches set replaces_cost_monthly = 10 where name = 'FLUX.1 [schnell]';
update launches set replaces_cost_monthly = 10 where name = 'FLUX.1 [dev]';
update launches set replaces_cost_monthly = 10 where name = 'Stable Diffusion 3.5';
update launches set replaces_cost_monthly = 10 where name = 'Kolors';
update launches set replaces_cost_monthly = 10 where name = 'ComfyUI';
update launches set replaces_cost_monthly = 10 where name = 'Fooocus';
update launches set replaces_cost_monthly = 10 where name = 'Draw Things';

update launches set replaces_cost_monthly = 20 where name = 'Ollama';
update launches set replaces_cost_monthly = 20 where name = 'LM Studio';
update launches set replaces_cost_monthly = 20 where name = 'Qwen (open models)';
update launches set replaces_cost_monthly = 20 where name = 'DeepSeek (open models)';
update launches set replaces_cost_monthly = 20 where name = 'Llama (open models)';
update launches set replaces_cost_monthly = 20 where name = 'Gemma';
update launches set replaces_cost_monthly = 20 where name = 'Mistral (open models)';

update launches set replaces_cost_monthly = 15 where name = 'NLLB-200';
update launches set replaces_cost_monthly = 15 where name = 'IndicTrans2';
update launches set replaces_cost_monthly = 15 where name = 'AI4Bharat';

update launches set replaces_cost_monthly = 15 where name = 'Surya';
update launches set replaces_cost_monthly = 15 where name = 'PaddleOCR';
update launches set replaces_cost_monthly = 15 where name = 'Tesseract';

update launches set replaces_cost_monthly = 10 where name = 'MusicGen';
update launches set replaces_cost_monthly = 15 where name = 'Stable Audio Open';

update launches set replaces_cost_monthly = 15 where name = 'LTX-Video';
update launches set replaces_cost_monthly = 15 where name = 'Mochi 1';

update launches set replaces_cost_monthly = 10 where name = 'Continue.dev';
update launches set replaces_cost_monthly = 20 where name = 'Cline';
update launches set replaces_cost_monthly = 10 where name = 'Qwen Coder';

-- anything still null but free gets a modest default
update launches set replaces_cost_monthly = 12
where free_alternative_to is not null and replaces_cost_monthly is null;

select count(*) as priced, sum(replaces_cost_monthly) as total_monthly
from launches where replaces_cost_monthly is not null;

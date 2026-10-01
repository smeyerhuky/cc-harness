import { Button, Slider } from '@garbage-day/ui';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { AppActorContext } from '../../state/appActor';
import { BOT_PRESETS, type BotChoice } from '../../state/appMachine';
import { usePrefs } from '../../state/prefs';
import styles from './Bot.module.css';

const PRESETS = Object.entries(BOT_PRESETS) as [keyof typeof BOT_PRESETS, number][];
const presetOf = (skill: number) => PRESETS.find(([, s]) => s === skill)?.[0];

/**
 * Choosing a bot (US-03): a preset starts at once, at the speed last chosen; or skill and speed
 * set separately from 1 to 10. Whatever is played is remembered on this device and offered again.
 */
export function BotSetupScreen() {
  const app = AppActorContext.useActorRef();
  const navigate = useNavigate();
  const last = usePrefs((s) => s.bot);
  const setBot = usePrefs((s) => s.setBot);
  const [skill, setSkill] = useState(last.skill);
  const [speed, setSpeed] = useState(last.speed);
  const play = (bot: BotChoice) => {
    setBot(bot);
    app.send({ type: 'PLAY_BOT', bot });
    void navigate('/play');
  };
  const lastPreset = presetOf(last.skill);
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Play a bot</h1>
      <section className={styles.section} aria-labelledby="bot-presets">
        <h2 id="bot-presets" className={styles.heading}>
          Presets
        </h2>
        <div className={styles.presets}>
          {PRESETS.map(([name, presetSkill]) => (
            <Button
              key={name}
              size="large"
              variant={name === (lastPreset ?? 'Regular') ? 'primary' : 'secondary'}
              onClick={() => play({ skill: presetSkill, speed: last.speed })}
            >
              {name}
            </Button>
          ))}
        </div>
        <p className={styles.note}>
          Rookie is skill 2, Regular 5, Pro 8, each at speed {last.speed}.
        </p>
      </section>
      <section className={styles.section} aria-labelledby="bot-own">
        <h2 id="bot-own" className={styles.heading}>
          Your own
        </h2>
        <Slider
          label="Skill"
          value={skill}
          min={1}
          max={10}
          onChange={setSkill}
          format={(n) => {
            const preset = presetOf(n);
            return preset ? `${n} · ${preset}` : String(n);
          }}
        />
        <Slider label="Speed" value={speed} min={1} max={10} onChange={setSpeed} />
        <p className={styles.note}>
          Skill is how well it places pieces; speed is how fast it thinks and moves. It plays by the
          same rules as you: garbage, speed-ups, power-ups and showdowns.
        </p>
        <Button variant="primary" onClick={() => play({ skill, speed })}>
          Play skill {skill}, speed {speed}
        </Button>
      </section>
      <Button variant="ghost" onClick={() => void navigate('/')}>
        Back
      </Button>
    </main>
  );
}

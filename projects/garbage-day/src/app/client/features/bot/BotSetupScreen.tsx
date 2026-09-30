import { Button } from '@garbage-day/ui';
import { useNavigate } from 'react-router';
import { AppActorContext } from '../../state/appActor';
import { BOT_PRESETS } from '../../state/appMachine';
import styles from '../screen.module.css';

/**
 * Choosing a bot. For now the three presets at speed 5; GD-STORY-006 adds separate skill and
 * speed sliders and remembers the choice.
 */
export function BotSetupScreen() {
  const app = AppActorContext.useActorRef();
  const navigate = useNavigate();
  const play = (skill: number) => {
    app.send({ type: 'PLAY_BOT', bot: { skill, speed: 5 } });
    void navigate('/play');
  };
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Play a bot</h1>
      <div className={styles.row}>
        {(Object.entries(BOT_PRESETS) as [string, number][]).map(([name, skill]) => (
          <Button
            key={name}
            size="large"
            variant={name === 'Regular' ? 'primary' : 'secondary'}
            onClick={() => play(skill)}
          >
            {name}
          </Button>
        ))}
      </div>
      <Button variant="ghost" onClick={() => void navigate('/')}>
        Back
      </Button>
    </main>
  );
}

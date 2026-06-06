import { execSync } from 'node:child_process';

const killPort5000 = () => {
  try {
    const output = execSync(
      'powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique"',
      { encoding: 'utf8' }
    );

    const pids = output
      .split(/\r?\n/)
      .map((line) => Number(line.trim()))
      .filter((value) => Number.isFinite(value) && value > 0);

    const uniquePids = [...new Set(pids)];

    if (uniquePids.length === 0) {
      console.log('[startup] Nu există procese Node pe portul 5000.');
      return;
    }

    for (const pid of uniquePids) {
      try {
        execSync(`taskkill /F /PID ${pid}`, { stdio: 'inherit' });
        console.log(`[startup] Procesul ${pid} de pe portul 5000 a fost închis.`);
      } catch (error) {
        console.warn(`[startup] Nu s-a putut închide PID ${pid}:`, error);
      }
    }
  } catch (error) {
    console.warn('[startup] Nu s-a putut verifica portul 5000:', error);
  }
};

killPort5000();

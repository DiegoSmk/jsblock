import { BrowserWindow } from 'electron';
import os from 'os';

export class TelemetryService {
    private statsInterval: NodeJS.Timeout | null = null;
    private lastCpus = os.cpus();

    start(window: BrowserWindow) {
        if (this.statsInterval) this.stop(window);

        this.lastCpus = os.cpus();

        this.statsInterval = setInterval(() => {
            if (!window || window.isDestroyed()) {
                this.stop();
                return;
            }

            const currentCpus = os.cpus();
            let totalDiff = 0;
            let idleDiff = 0;

            for (let i = 0; i < currentCpus.length; i++) {
                if (!this.lastCpus[i]) continue;

                const last = this.lastCpus[i].times;
                const current = currentCpus[i].times;

                const lastTotal = last.user + last.nice + last.sys + last.idle + last.irq;
                const currentTotal = current.user + current.nice + current.sys + current.idle + current.irq;

                totalDiff += currentTotal - lastTotal;
                idleDiff += current.idle - last.idle;
            }

            const cpuUsage = totalDiff > 0 ? (1 - idleDiff / totalDiff) * 100 : 0;

            if (!window.isDestroyed()) {
                window.webContents.send('system:stats', { cpu: Math.round(cpuUsage) });
            }

            this.lastCpus = currentCpus;
        }, 1000);
    }

    stop(window?: BrowserWindow) {
        if (this.statsInterval) {
            clearInterval(this.statsInterval);
            this.statsInterval = null;
        }

        if (window && !window.isDestroyed()) {
            window.webContents.send('system:stats', { cpu: 0 });
        }
    }
}

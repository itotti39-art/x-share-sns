import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';

export function formatDate(isoString: string): string {
    if (!isoString) return '';
    return format(parseISO(isoString), 'yyyy/MM/dd HH:mm', { locale: ja });
}

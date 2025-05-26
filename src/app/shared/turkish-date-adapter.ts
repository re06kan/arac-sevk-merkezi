import { NativeDateAdapter } from '@angular/material/core';

export class TurkishDateAdapter extends NativeDateAdapter {
  override getFirstDayOfWeek(): number {
    return 1; // Pazartesi
  }

  override getDayOfWeekNames(style: 'long' | 'short' | 'narrow'): string[] {
    if (style === 'short') {
      return ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
    }
    if (style === 'narrow') {
      return ['P', 'P', 'S', 'Ç', 'P', 'C', 'C'];
    }
    return ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  }

  override getMonthNames(style: 'long' | 'short' | 'narrow'): string[] {
    if (style === 'short') {
      return ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz',
              'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    }
    if (style === 'narrow') {
      return ['O', 'Ş', 'M', 'N', 'M', 'H', 'T', 'A', 'E', 'E', 'K', 'A'];
    }
    return ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
            'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  }
}

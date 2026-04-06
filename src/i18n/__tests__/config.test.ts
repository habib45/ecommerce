import { describe, it, expect, vi } from 'vitest';
import { SUPPORTED_LOCALES, changeLocale } from '../config';

describe('SUPPORTED_LOCALES', () => {
  it('has three locales', () => {
    expect(SUPPORTED_LOCALES).toHaveLength(3);
  });

  it('includes en, bn-BD, sv', () => {
    expect(SUPPORTED_LOCALES).toContain('en');
    expect(SUPPORTED_LOCALES).toContain('bn-BD');
    expect(SUPPORTED_LOCALES).toContain('sv');
  });
});

describe('changeLocale', () => {
  it('is callable without throwing', () => {
    expect(() => changeLocale('en')).not.toThrow();
    expect(() => changeLocale('bn-BD')).not.toThrow();
    expect(() => changeLocale('sv')).not.toThrow();
  });

  it('calls the mock (changeLocale is mocked in setup)', () => {
    changeLocale('en');
    expect(changeLocale).toHaveBeenCalledWith('en');
  });
});

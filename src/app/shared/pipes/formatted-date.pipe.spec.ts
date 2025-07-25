import { FormattedDatePipe } from './formatted-date.pipe';

describe('FormattedDatePipe', () => {
  it('create an instance', () => {
    const pipe = new FormattedDatePipe();
    expect(pipe).toBeTruthy();
  });
});

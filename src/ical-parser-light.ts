export interface ICalendarEvent extends ICalendarItem {
  readonly summary: string;
  readonly startDate: Date;
  readonly endDate: Date;
  readonly isAllDay: boolean;
  readonly description: string;
}

interface ICalendarItem {
  readonly type: string;
  getText(key: string): string;
  getDateTime(key: string): IDateTime | null;
}

interface ICalendarItemGenerator {
  push(key: string, opt: string, value: string): void;
}

interface ICalendarItemsStore {
  [key: string]: ICalendarItem[];
}

export interface IICSCalendar extends ICalendarItem, IterableIterator<ICalendarEvent> {
  readonly items: ICalendarItemsStore;
  readonly events: IterableIterator<ICalendarEvent>;
}

interface IValueStore {
  [key: string]: { value: string; opt: string };
}

interface IDateTime {
  date: Date;
  timezone: string;
  allDay: boolean;
}

class CalendarItem implements ICalendarItem, ICalendarItemGenerator {
  private pValueStore: IValueStore = {};
  private pType: string;

  constructor(type: string) {
    this.pType = type;
  }

  get type() {
    return this.pType;
  }

  push(key: string, opt: string, value: string): void {
    this.pValueStore[key] = { value: value, opt: opt };
  }

  getText(key: string): string {
    return unescape(this.pValueStore[key].value);
  }

  getDateTime(key: string): IDateTime | null {
    let value = this.pValueStore[key].value;
    let [, year, month, date, time] = /^(\d{4})(\d{2})(\d{2})(?:$|T(.+)Z)/.exec(value) || [
      0,
      0,
      0,
      0,
      undefined
    ];
    if (year) {
      return {
        date: new Date(Number(year), Number(month) - 1, Number(date), Number(time || 0)),
        timezone: '',
        allDay: time == undefined
      };
    }
    return null;
  }

  // Unescape Text re RFC 4.3.11
  unescape(t: string) {
    t = t || '';
    return t
      .replace(/\\\,/g, ',')
      .replace(/\\\;/g, ';')
      .replace(/\\[nN]/g, '\n')
      .replace(/\\\\/g, '\\');
  }
}

class ICSCalendar extends CalendarItem implements IICSCalendar {
  private pitems: ICalendarItemsStore = {};

  constructor() {
    super('VCALENDAR');
  }

  createItem(type: string): CalendarItem {
    let result: CalendarItem;
    switch (type) {
      case 'VEVENT':
        result = new calendarEvent();
        break;
      default:
        result = new CalendarItem(type);
    }
    this.pitems[type] = this.pitems[type] || [];
    this.pitems[type].push(result);
    return result;
  }

  get items() {
    return this.pitems;
  }

  get events() {
    return this.generateEvents();
  }

  next(value?: any) {
    return this.generateEvents().next(value);
  }

  [Symbol.iterator] = this.generateEvents;

  *generateEvents(): IterableIterator<ICalendarEvent> {
    for (let event of this.pitems['VEVENT']) {
      yield event as ICalendarEvent;
    }
  }
}

class calendarEvent extends CalendarItem {
  constructor() {
    super('VEVENT');
  }

  get summary(): string {
    return this.getText('SUMMARY');
  }

  get description(): string {
    return this.getText('DESCRIPTION');
  }

  get startDate() {
    let dateTime = this.getDateTime('DTSTART');
    if (dateTime) return dateTime.date;
    return 0;
  }

  get endDate() {
    let dateTime = this.getDateTime('DTEND');
    if (dateTime) return dateTime.date;
    return 0;
  }

  get isAllDay() {
    let dateTime = this.getDateTime('DTSTART');
    if (dateTime) return dateTime.allDay;
    return false;
  }
}

export default function parseIcal(text: string): IICSCalendar {
  const cal = new ICSCalendar();
  let currentItem: CalendarItem | null = null;

  function* generateLines(text: string): IterableIterator<string> {
    let lines = text.split(/\r?\n/);
    let line = '';
    while (lines.length > 0) {
      let [l, next] = lines;
      lines.shift();
      line += l.replace(/(^ )/gm, ''); // A line starts with space should be connect to previous one
      if (next && /^ /gm.test(next)) continue;
      yield line;
      line = '';
    }
  }

  for (const line of generateLines(text)) {
    let [, key, opt, key2, value] = (line.match(/^(?:(.+)\;(.+)|(.+))\:(.+)/) || []).map(s =>
      s ? s.trim() : ''
    );
    key = key || key2;

    switch (key) {
      case 'BEGIN':
        currentItem = cal.createItem(value);
      default:
        if (currentItem) currentItem.push(key, opt, value);
        break;
    }
  }
  return cal;
}

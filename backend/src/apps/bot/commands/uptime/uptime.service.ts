import { Injectable } from '@nestjs/common';

const oStartDate: Date = new Date();

@Injectable()
export class UptimeService {
  public getUpTime() {
    const _sec = 1000;
    const _min = _sec * 60;
    const _hour = _min * 60;
    const _day = _hour * 24;

    const curDate: Date = new Date();
    const diffDate = curDate.valueOf() - oStartDate.valueOf();
    const d_day = Math.floor(diffDate / _day);
    const d_hour = Math.floor((diffDate % _day) / _hour);
    const d_min = Math.floor((diffDate % _hour) / _min);
    const d_sec = Math.floor((diffDate % _min) / _sec);
    const d_msec = diffDate % _sec;

    let diffDateStr = '';
    if (d_day > 0) diffDateStr += d_day + '일 ';
    if (d_hour > 0) diffDateStr += d_hour + '시간 ';
    if (d_min > 0) diffDateStr += d_min + '분 ';
    if (d_sec > 0) diffDateStr += d_sec + '초 ';
    if (d_msec > 0) diffDateStr += d_msec + '';

    return diffDateStr;
  }
}

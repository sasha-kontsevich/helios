import { Context } from '../engine';
import { System } from '../engine';

export type SystemConstructor = new (context: Context) => System;

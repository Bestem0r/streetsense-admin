import '@angular/compiler'; // must be first — enables JIT compilation
import 'zone.js';
import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import { ɵresolveComponentResources as resolveComponentResources } from '@angular/core';
import { vi, beforeAll } from 'vitest';

beforeAll(async () => {
  await resolveComponentResources(() =>
    Promise.resolve({ text: () => Promise.resolve('') } as Response),
  );
});

getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
);

(globalThis as any).jasmine = {
  createSpy: (name: string) => vi.fn().mockName(name),
  createSpyObj: (name: string, methods: string[]) => {
    const obj: Record<string, ReturnType<typeof vi.fn>> = {};
    methods.forEach((m) => (obj[m] = vi.fn().mockName(`${name}.${m}`)));
    return obj;
  },
  any: (type: any) => expect.any(type),
  objectContaining: (obj: object) => expect.objectContaining(obj),
  arrayContaining: (arr: unknown[]) => expect.arrayContaining(arr),
};

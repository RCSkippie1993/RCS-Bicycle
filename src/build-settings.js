export const settingsKey='rcs-build-settings';
export const tireSetups={unsure:'Confirm with supplier',tubes:'Inner tubes',tubeless:'Tubeless'};
export const normalizeSettings=raw=>({tireSetup:raw&&Object.hasOwn(tireSetups,raw.tireSetup)?raw.tireSetup:'unsure'});

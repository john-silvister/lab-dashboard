// Shared constants used across the application

export const DEPARTMENTS = [
    'CSE',
    'ECE',
    'EEE',
    'Mechanical',
    'Civil',
    'Chemical',
    'Biotechnology'
];

export const ROLES = ['student', 'faculty', 'admin'];

export const BOOKING_STATUS = ['pending', 'approved', 'rejected', 'cancelled'];

export const BOOKING_LIMITS = {
    MAX_DURATION_HOURS: 8,
    MAX_ADVANCE_DAYS: 30,
    DEFAULT_START_HOUR: 9,
    DEFAULT_END_HOUR: 18
};

export const EMAIL_DOMAINS = {
    STUDENT: '@btech.christuniversity.in',
    FACULTY: '@christuniversity.in'
};

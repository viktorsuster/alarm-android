export const useTranslate = () => {
    return (key: string): string => {
        // This is a mock hook. It replaces underscores with spaces and capitalizes the first letter.
        const text = key.replace(/_/g, ' ');
        return text.charAt(0).toUpperCase() + text.slice(1);
    };
};

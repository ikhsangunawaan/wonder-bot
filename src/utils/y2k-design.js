const { EmbedBuilder } = require('discord.js');
const config = require('../../config.json');

class Y2KDesign {
    constructor() {
        this.colors = config.colors;
        this.theme = config.theme;
    }

    // Create styled embed with Y2K Kingdom aesthetic
    createEmbed(type = 'primary') {
        const colorMap = {
            primary: this.colors.primary,
            secondary: this.colors.secondary,
            success: this.colors.success,
            error: this.colors.error,
            warning: this.colors.warning,
            info: this.colors.info,
            royal: this.colors.royal,
            cyber: this.colors.cyber,
            kingdom: this.colors.kingdom,
            accent: this.colors.accent
        };

        return new EmbedBuilder()
            .setColor(colorMap[type] || this.colors.primary)
            .setTimestamp();
    }

    // Add Y2K styling to embed title
    styleTitle(title, prefix = null) {
        const prefixMap = {
            royal: this.theme.prefixes.royal,
            cyber: this.theme.prefixes.cyber,
            kingdom: this.theme.prefixes.kingdom,
            legend: this.theme.prefixes.legend,
            elite: this.theme.prefixes.elite
        };

        const selectedPrefix = prefix ? prefixMap[prefix] : '';
        return `${selectedPrefix} ${title}`.trim();
    }

    // Create level badge with Y2K styling
    createLevelBadge(level, maxLevel = 50) {
        if (level >= maxLevel) {
            return `${this.theme.emojis.crown} Lv.${level} ${this.theme.emojis.crown}`;
        } else if (level >= 40) {
            return `${this.theme.emojis.gem} Lv.${level}`;
        } else if (level >= 25) {
            return `${this.theme.emojis.star} Lv.${level}`;
        } else if (level >= 10) {
            return `${this.theme.emojis.crystal} Lv.${level}`;
        } else {
            return `Lv.${level}`;
        }
    }

    // Create progress bar with Y2K aesthetic
    createProgressBar(current, max, length = 10) {
        const percentage = Math.min(Math.max(current / max, 0), 1);
        const filled = Math.floor(percentage * length);
        const empty = length - filled;
        
        const filledChar = '▰';
        const emptyChar = '▱';
        
        return `${filledChar.repeat(filled)}${emptyChar.repeat(empty)}`;
    }

    // Format numbers with Y2K styling
    formatNumber(num) {
        if (num >= 1000000) {
            return `${(num / 1000000).toFixed(1)}M`;
        } else if (num >= 1000) {
            return `${(num / 1000).toFixed(1)}K`;
        }
        return num.toLocaleString();
    }

    // Create rank display with crown emojis
    createRankDisplay(position) {
        switch (position) {
            case 1:
                return `${this.theme.emojis.crown} #1`;
            case 2:
                return `${this.theme.emojis.gem} #2`;
            case 3:
                return `${this.theme.emojis.star} #3`;
            default:
                return `${this.theme.emojis.crystal} #${position}`;
        }
    }

    // Create level type icon
    getLevelTypeIcon(type, isMaxLevel = false) {
        const icons = {
            text: isMaxLevel ? `${this.theme.emojis.crown} 💬` : '💬',
            voice: isMaxLevel ? `${this.theme.emojis.crown} 🎤` : '🎤',
            role: isMaxLevel ? `${this.theme.emojis.crown} ⭐` : '⭐',
            overall: isMaxLevel ? `${this.theme.emojis.crown} ${this.theme.emojis.kingdom}` : this.theme.emojis.kingdom
        };
        return icons[type] || '❔';
    }

    // Create reward message with styling
    styleRewardMessage(amount, currency) {
        return `${this.theme.emojis.magic} **${this.formatNumber(amount)}** ${currency} ${this.theme.emojis.magic}`;
    }

    // Create divider line
    createDivider() {
        return '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    }

    // Create footer with Y2K branding
    createFooter(text = null) {
        const defaultText = `${this.theme.emojis.cyber} Y2K Kingdom ${this.theme.emojis.cyber} • Modern Royalty Awaits`;
        return text || defaultText;
    }

    // Get color by level tier
    getLevelColor(level, maxLevel = 50) {
        if (level >= maxLevel) {
            return this.colors.kingdom; // Gold for max level
        } else if (level >= 40) {
            return this.colors.royal; // Purple for high level
        } else if (level >= 25) {
            return this.colors.cyber; // Cyan for mid-high level
        } else if (level >= 10) {
            return this.colors.accent; // Turquoise for mid level
        } else {
            return this.colors.primary; // Pink for low level
        }
    }

    // Create status indicator
    createStatusIndicator(status) {
        const indicators = {
            online: `${this.theme.emojis.magic} ONLINE`,
            offline: `${this.theme.emojis.crystal} OFFLINE`,
            active: `${this.theme.emojis.star} ACTIVE`,
            legendary: `${this.theme.emojis.crown} LEGENDARY`,
            royal: `${this.theme.emojis.royal} ROYAL`,
            cyber: `${this.theme.emojis.cyber} CYBER`
        };
        return indicators[status] || status;
    }

    // Create minimalist field separator
    createFieldSeparator() {
        return '▸';
    }

    // Style username with tier indication
    styleUsername(username, level, maxLevel = 50) {
        if (level >= maxLevel) {
            return `${this.theme.emojis.crown} ${username}`;
        } else if (level >= 40) {
            return `${this.theme.emojis.gem} ${username}`;
        } else if (level >= 25) {
            return `${this.theme.emojis.star} ${username}`;
        }
        return username;
    }
}

module.exports = Y2KDesign;
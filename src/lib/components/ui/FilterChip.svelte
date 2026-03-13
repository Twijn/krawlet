<script lang="ts">
    import Chip from "./Chip.svelte";

    type Props = {
        /** Filter field name */
        field: string;
        /** Filter value */
        value: string;
        /** Custom color for the chip */
        color?: string;
        /** Whether the chip can be removed */
        removable?: boolean;
        /** Called when filter is removed */
        onRemove?: () => void;
    };

    let {
        field,
        value,
        color = "var(--blue)",
        removable = true,
        onRemove
    }: Props = $props();
</script>

<Chip label={field} {value} {color} {removable} {onRemove} />

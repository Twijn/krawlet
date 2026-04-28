<script lang="ts">
	import Modal from "../ui/Modal.svelte";

    let {
        open = $bindable(false),
    }: {
        open?: boolean;
    } = $props();

    let quickCode = $state('');

    function onClose() {
        open = false;
    }
</script>

<Modal {onClose} title="Krawlet Login" maxWidth="500px">
    <p>To gain access to specialized features (such as Klog integration), you need to log in with Krawlet.</p>
    <p>Use <code>\krawlet api</code> on ReconnectedCC to generate a quick code.</p>
    <label class="quick-code-label">
        Quick Code
        <input type="text" name="quickCode" bind:value={quickCode} required minlength="6" maxlength="6" />
    </label>
</Modal>

<style>
    .quick-code-label {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .quick-code-label input {
        padding: 0.5rem;
        font-size: 1rem;
        border: 1px solid #ccc;
        border-radius: 4px;
    }
</style>

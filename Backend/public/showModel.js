<script>
function showModal(options) {
  // Simple modal using SweetAlert2 or create a custom modal
  if (typeof Swal !== 'undefined') {
    Swal.fire({
      title: options.title,
      text: options.message,
      icon: options.icon || 'question',
      showCancelButton: options.onConfirm ? true : false,
      confirmButtonText: options.confirmText || 'OK',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed && options.onConfirm) {
        options.onConfirm();
      }
    });
  } else {
    // Fallback to browser confirm
    if (options.onConfirm) {
      if (confirm(options.message)) {
        options.onConfirm();
      }
    } else {
      alert(options.message);
    }
  }
}
</script>
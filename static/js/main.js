/**
 * ===================================================================
 * Bastian Build Expense OS — Main Application Logic
 * The RoSh Worldwide · 2026
 *
 * jQuery + AJAX engine for async CRUD on the Expense Chargesheet.
 * ===================================================================
 */

$(document).ready(function () {

    // ── Constants ──────────────────────────────────────────────────
    const API_BASE = '/api/expenses/';
    let allExpenses = [];       // Local cache for search/filter
    let deleteTargetId = null;  // ID staged for deletion

    // ── Init ──────────────────────────────────────────────────────
    startClock();
    fetchExpenses();


    // =================================================================
    //  SYSTEM CLOCK
    // =================================================================
    function startClock() {
        function tick() {
            const now  = new Date();
            const opts = {
                weekday: 'short', year: 'numeric', month: 'short',
                day: 'numeric',   hour: '2-digit',  minute: '2-digit',
                second: '2-digit', hour12: true,
            };
            $('#systemClock').text(now.toLocaleDateString('en-IN', opts));
        }
        tick();
        setInterval(tick, 1000);
    }


    // =================================================================
    //  FETCH EXPENSES  (GET)
    // =================================================================
    function fetchExpenses() {
        $('#tableLoader').removeClass('d-none');
        $('#emptyState').addClass('d-none');
        $('#expenseTableBody').empty();

        $.ajax({
            url: API_BASE,
            method: 'GET',
            dataType: 'json',
            success: function (data) {
                allExpenses = data;
                renderTable(data);
                updateKPIs(data);
            },
            error: function () {
                showToast('Failed to fetch expenses.', 'error');
            },
            complete: function () {
                $('#tableLoader').addClass('d-none');
            },
        });
    }


    // =================================================================
    //  RENDER TABLE
    // =================================================================
    function renderTable(expenses) {
        const $body = $('#expenseTableBody');
        $body.empty();

        if (expenses.length === 0) {
            $('#emptyState').removeClass('d-none');
            $('#expenseTable').addClass('d-none');
            return;
        }

        $('#emptyState').addClass('d-none');
        $('#expenseTable').removeClass('d-none');

        expenses.forEach(function (exp, idx) {
            const priorityClass = exp.priority.toLowerCase();
            const statusClass   = exp.status.toLowerCase();
            const isOverdue     = new Date(exp.due_date) < new Date() && exp.status !== 'PAID';
            const dateClass     = isOverdue ? 'overdue-date' : '';

            const row = `
                <tr style="animation-delay: ${idx * 0.04}s">
                    <td class="text-muted">${idx + 1}</td>
                    <td><strong>${escapeHtml(exp.title)}</strong></td>
                    <td>
                        <span class="amount-display">
                            <span class="amount-currency">₹</span>${parseFloat(exp.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                    </td>
                    <td><span class="date-display ${dateClass}">${formatDate(exp.due_date)}</span></td>
                    <td><span class="badge-priority ${priorityClass}">${priorityLabel(exp.priority)}</span></td>
                    <td><span class="badge-status ${statusClass}">${statusLabel(exp.status)}</span></td>
                    <td class="text-center">
                        <button class="btn-action edit me-1" title="Edit" data-id="${exp.id}">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn-action delete" title="Delete" data-id="${exp.id}" data-title="${escapeHtml(exp.title)}">
                            <i class="bi bi-trash3"></i>
                        </button>
                    </td>
                </tr>`;
            $body.append(row);
        });
    }


    // =================================================================
    //  UPDATE KPIs
    // =================================================================
    function updateKPIs(data) {
        const total    = data.length;
        const liability = data.reduce((sum, e) => sum + parseFloat(e.amount), 0);
        const critical = data.filter(e => e.priority === 'CRITICAL').length;
        const paid     = data.filter(e => e.status === 'PAID').length;

        animateCounter('#kpiTotal', total);
        $('#kpiLiability').text('₹' + liability.toLocaleString('en-IN', { minimumFractionDigits: 2 }));
        animateCounter('#kpiCritical', critical);
        animateCounter('#kpiPaid', paid);
    }

    function animateCounter(selector, target) {
        const $el = $(selector);
        const current = parseInt($el.text().replace(/[^0-9]/g, '')) || 0;
        if (current === target) { $el.text(target); return; }
        $({ val: current }).animate({ val: target }, {
            duration: 400,
            easing: 'swing',
            step: function () { $el.text(Math.round(this.val)); },
            complete: function () { $el.text(target); },
        });
    }


    // =================================================================
    //  CREATE / UPDATE  (POST / PUT)
    // =================================================================
    $('#expenseForm').on('submit', function (e) {
        e.preventDefault();

        // ── Client-side validation ──
        const form = this;
        if (!form.checkValidity()) {
            $(form).addClass('was-validated');
            return;
        }

        const expenseId = $('#expenseId').val();
        const payload   = {
            title:    $('#expTitle').val().trim(),
            amount:   parseFloat($('#expAmount').val()),
            due_date: $('#expDueDate').val(),
            priority: $('#expPriority').val(),
            status:   $('#expStatus').val(),
        };

        const isEdit = !!expenseId;
        const url    = isEdit ? API_BASE + expenseId + '/' : API_BASE;
        const method = isEdit ? 'PUT' : 'POST';

        $('#btnSubmit').prop('disabled', true).html(
            '<span class="spinner-border spinner-border-sm me-1"></span> Saving…'
        );

        $.ajax({
            url: url,
            method: method,
            contentType: 'application/json',
            data: JSON.stringify(payload),
            success: function () {
                showToast(
                    isEdit ? 'Expense updated successfully.' : 'Expense added to chargesheet.',
                    'success',
                );
                resetForm();
                fetchExpenses();
            },
            error: function (xhr) {
                const errors = xhr.responseJSON;
                let msg = 'Validation failed.';
                if (errors) {
                    const firstKey = Object.keys(errors)[0];
                    msg = firstKey + ': ' + (Array.isArray(errors[firstKey]) ? errors[firstKey][0] : errors[firstKey]);
                }
                showToast(msg, 'error');
            },
            complete: function () {
                $('#btnSubmit').prop('disabled', false).html(
                    isEdit
                        ? '<i class="bi bi-check-lg me-1"></i> Update Expense'
                        : '<i class="bi bi-plus-lg me-1"></i> Add Expense'
                );
            },
        });
    });


    // =================================================================
    //  EDIT — populate form
    // =================================================================
    $(document).on('click', '.btn-action.edit', function () {
        const id  = $(this).data('id');
        const exp = allExpenses.find(e => e.id === id);
        if (!exp) return;

        $('#expenseId').val(exp.id);
        $('#expTitle').val(exp.title);
        $('#expAmount').val(exp.amount);
        $('#expDueDate').val(exp.due_date);
        $('#expPriority').val(exp.priority);
        $('#expStatus').val(exp.status);

        $('#formTitle').text('Edit Expense');
        $('#btnSubmit').html('<i class="bi bi-check-lg me-1"></i> Update Expense');
        $('#btnCancel').removeClass('d-none');

        // Scroll form into view
        $('html, body').animate({ scrollTop: $('#expenseForm').offset().top - 100 }, 400);
    });


    // =================================================================
    //  CANCEL EDIT
    // =================================================================
    $('#btnCancel').on('click', function () {
        resetForm();
    });


    // =================================================================
    //  DELETE — open modal
    // =================================================================
    $(document).on('click', '.btn-action.delete', function () {
        deleteTargetId = $(this).data('id');
        $('#deleteExpTitle').text($(this).data('title'));
        new bootstrap.Modal('#deleteModal').show();
    });

    // Confirm delete
    $('#btnConfirmDelete').on('click', function () {
        if (!deleteTargetId) return;

        $(this).prop('disabled', true).html(
            '<span class="spinner-border spinner-border-sm me-1"></span> Deleting…'
        );

        $.ajax({
            url: API_BASE + deleteTargetId + '/',
            method: 'DELETE',
            success: function () {
                showToast('Expense removed from chargesheet.', 'success');
                fetchExpenses();
            },
            error: function () {
                showToast('Failed to delete expense.', 'error');
            },
            complete: function () {
                deleteTargetId = null;
                bootstrap.Modal.getInstance(document.getElementById('deleteModal')).hide();
                $('#btnConfirmDelete').prop('disabled', false).html(
                    '<i class="bi bi-trash3 me-1"></i> Delete'
                );
            },
        });
    });


    // =================================================================
    //  SEARCH & FILTER
    // =================================================================
    $('#searchInput').on('input', applyFilters);
    $('#filterPriority').on('change', applyFilters);

    function applyFilters() {
        const query    = $('#searchInput').val().toLowerCase().trim();
        const priority = $('#filterPriority').val();

        let filtered = allExpenses;

        if (query) {
            filtered = filtered.filter(e =>
                e.title.toLowerCase().includes(query) ||
                e.status.toLowerCase().includes(query)
            );
        }

        if (priority) {
            filtered = filtered.filter(e => e.priority === priority);
        }

        renderTable(filtered);
    }


    // =================================================================
    //  HELPERS
    // =================================================================
    function resetForm() {
        $('#expenseForm')[0].reset();
        $('#expenseForm').removeClass('was-validated');
        $('#expenseId').val('');
        $('#formTitle').text('New Expense');
        $('#btnSubmit').html('<i class="bi bi-plus-lg me-1"></i> Add Expense');
        $('#btnCancel').addClass('d-none');
    }

    function formatDate(dateStr) {
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    function priorityLabel(p) {
        const map = { CRITICAL: '🔴 Critical', HIGH: '🟠 High', MEDIUM: '🟡 Medium', LOW: '🟢 Low' };
        return map[p] || p;
    }

    function statusLabel(s) {
        const map = { PENDING: '⏳ Pending', APPROVED: '✅ Approved', PAID: '💰 Paid', OVERDUE: '🚨 Overdue' };
        return map[s] || s;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(text));
        return div.innerHTML;
    }

    function showToast(message, type) {
        type = type || 'info';
        const icons = { success: 'bi-check-circle-fill', error: 'bi-exclamation-triangle-fill', info: 'bi-info-circle-fill' };
        const html = `
            <div class="toast toast-custom ${type}" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-body">
                    <i class="bi ${icons[type] || icons.info}"></i>
                    <span>${message}</span>
                </div>
            </div>`;

        const $toast = $(html).appendTo('#toastContainer');
        const bsToast = new bootstrap.Toast($toast[0], { delay: 3500 });
        bsToast.show();

        $toast[0].addEventListener('hidden.bs.toast', function () {
            $toast.remove();
        });
    }

});

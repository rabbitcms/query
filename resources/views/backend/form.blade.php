@extends('backend::layouts.modal')
@section('modal')
    <div class="modal-header">
        <button type="button" class="close" data-dismiss="modal" aria-hidden="true"></button>
        <h4 class="modal-title">Збереження вибірки</h4>
    </div>
    <form method="post" action="{{route('backend.query.queries.save', [], false)}}" class="form-horizontal" id="query-form">
        {{csrf_field()}}

        <div class="modal-body">

            <div class="form-group">
                <label class="control-label col-md-3">Назва</label>
                <div class="col-md-8">
                    <input type="text" class="form-control" name="name" value="">
                </div>
            </div>

            <div class="form-group">
                <label class="control-label col-md-3">&nbsp;</label>
                <div class="col-md-9">
                    <label class="mt-checkbox mt-checkbox-outline">
                        <input type="checkbox" name="id"> Оновити
                        <span></span>
                    </label>
                </div>
            </div>
        </div>
        <div class="modal-footer">
            <button type="button" data-dismiss="modal" class="btn red">
                <i class="fa fa-close"></i> Скасувати</button>
            <button type="submit" class="btn green">
                <i class="fa fa-check"></i> Зберегти</button>
        </div>
    </form>
@endsection

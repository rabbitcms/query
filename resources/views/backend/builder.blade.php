@can('queries.queries.read')
    <link href="{{module_asset('query', 'backend/css/query-builder.default.css')}}" rel="stylesheet" type="text/css">
    <div class="panel-group accordion" id="search-container-{{$entity->getName()}}" data-require="rabbitcms/queries:component" data-entity="{{$entity->getName()}}">
        <div class="panel panel-default">
            <div class="panel-heading">
                <h4 class="panel-title">
                    <a class="accordion-toggle accordion-toggle-styled collapsed" data-toggle="collapse" data-parent="#search-container-{{$entity->getName()}}" href="#search-{{$entity->getName()}}" aria-expanded="false">
                        Розширений пошук</a>
                </h4>
            </div>
            <div id="search-{{$entity->getName()}}" class="panel-collapse collapse" aria-expanded="false">
                <div class="panel-body">
                    <div class="row">
                        <div class="col-md-3">
                            <select class="form-control" name="queries-list">
                                <option value="">Нова вибірка</option>
                                @foreach($queries as $query)
                                    <option value="{{$query->id}}">{{$query->name}}</option>
                                @endforeach
                            </select>
                        </div>
                        <div class="col-md-1">
                            @can('queries.queries.write')
                                <button class="btn btn-default" rel="save-query">
                                    <i class="fa fa-save"></i> Зберегти
                                </button>
                            @endcan
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-12">
                            <div class="search-container" data-filters="{{json_encode($entity->getFilters())}}"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
@endcan

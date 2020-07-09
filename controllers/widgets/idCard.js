/*
 * Based on OpenIZ, Copyright (C) 2015 - 2019 Mohawk College of Applied Arts and Technology
 * Copyright (C) 2019 - 2020, Fyfe Software Inc. and the SanteSuite Contributors (See NOTICE.md)
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you 
 * may not use this file except in compliance with the License. You may 
 * obtain a copy of the License at 
 * 
 * http://www.apache.org/licenses/LICENSE-2.0 
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the 
 * License for the specific language governing permissions and limitations under 
 * the License.
 * 
 * User: fyfej
 * Date: 2019-11-27
 */

 /** 
  * @fileoverview Illustrates a controller which is attached to a shared widget. 
  * @see https://help.santesuite.org/santedb/extending-santedb/applets/assets/html-widgets
  * @summary This controller will watch when a scoped object is assigned to the ID card widget and will use the code generator to generate a QR code
  */
/// <reference path="../../.ref/js/SanteDB.js" />
angular.module("santedb").controller("ElboniaIdCardWidgetController", ["$scope", "$rootScope", "$interval", function ($scope, $rootScope, $interval) {

    $scope.$watch("scopedObject", async function (n, o) {
        if(n) {
            if(n.identifier) {
                n.barcodeId = n.identifier['MOH_NHID'] || n.identifier['MOH_MPI_TMP'];
                if(n.barcodeId) {
                    n.barcodeUrl = `/hdsi/Patient/${n.id}/_code/${n.barcodeId.authority.id}?_sessionId=${window.sessionStorage.getItem("token")}`;
                }
            }
        }
    });
}]);